看到一个有趣的算法，能在最坏时间复杂度 $\mathcal{O}(n)$ 内求出序列第 $k$ 小。

首先如果是期望线性的话，应该是非常简单的，就是我们直接使用快速排序的分治思想，随机选一个数作为 pivot，把比她小的放前面，比她大的放后面，于是就形成了左右两边，紧接着考虑左边的 size 是否小于 $k$ 进行分治。

但我们需要的是确定性算法。

首先我们保证每个数是不相同的，这很好保证，只要开个 `pair`，在每个数后面附上一个 `index` 以双关键字比较即可。

现在有一个非常有趣的想法，就是我们用一种方法来找到一个 pivot，让这个 pivot 比较居中。我们考虑将序列按照每五个切成片，这样的话如果是一个长度为 $n$ 的序列，就会被切成 $\left\lceil \frac{n}{5}\right\rceil$ 片，每片至多 $5$ 个数，然后我们对这 $5$ 个数取中位数，并将其提取出来，得到一个新的序列。这样这个新的序列的长度为 $\left\lceil\frac{n}{5}\right\rceil$。然后我们递归地求出这个序列的中位数（也就是该序列的第 $\left\lfloor\frac{\left\lceil\frac{n}{5}\right\rceil}{2}\right\rfloor$ 小值，这也是一个 $k$ 小值问题）。然后将该数作为 pivot 进行分治。

我们考虑这个 pivot 的性质。考虑到此时计算起来比较麻烦，又考虑到这是一个分治算法，我们可以在 $n\le 100$ 的时候直接采用排序，不影响复杂度。而在 $n$ 比较大的时候，为了方便计算，我们在计算中忽略底和顶、少数加减常数以及脚块对复杂度的影响。假设这个 pivot 的值是 $p$，那么由于她是每个切片的中位数的中位数，也就是说，至少有 $\frac{\frac{n}{5}}{2}=\frac{n}{10}$ 个切片的中位数比她小，$\frac{n}{10}$ 个切片的中位数比她大。而在这些切片中，考虑到每个切片都有两个数大于中位数，两个数小于中位数，因此至少有 $\frac{n}{5}$ 个非切片中位数的数大于和小于 pivot。也就是说，有 $\frac{n}{10} + \frac{n}{5}=\frac{3}{10}n$ 个数大于和小于 pivot。那么分治时，不管是大于还是小于 $k$，一定是有 $\frac{3}{10}n$ 个数是会被删掉的。也就是说，每次递归只会留下 $\frac{7}{10}n$ 个数。

这样复杂度就是：

$$
T(n)=T\left(\frac{n}{5}\right) + T\left(\frac{7}{10}n\right) + \mathcal{O}(n)
$$

我们用第二数学归纳法证明 $T(n)=\mathcal{O}(n)$。我们假设 $\exists c\in\mathbb{N}, \forall k<n, T(k)\le c\cdot k$。归纳基础显然。

$$
\begin{aligned}
T(n)&=T\left(\frac{n}{5}\right) + T\left(\frac{7}{10}n\right) + \mathcal{O}(n)\\
&\le c\cdot\frac{n}{5} + c\cdot \frac{7}{10}n+\mathcal{O}(n)\\
&\le c\cdot\frac{9}{10}n + \mathcal{O}(n)
\end{aligned}
$$

当 $c$ 足够大到 $\frac{c}{10}$ 大于等式中 $\mathcal{O}(n)$ 的系数时，$T(n)\le c\cdot n$。

因此，该算法复杂度为线性。

前几天刚开始学 `java`，那就拿 `java` 来练练手。

```java
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

public class Nth {
    /**
     * Integers with a subscript, to make sure all numbers
     * in the array are different.
     */
    public static class DistinctNumber implements Comparable<DistinctNumber> {
        private final int number, index;

        /**
         * @param _number the value of the number.
         * @param _index  the index of the number in the array.
         */
        public DistinctNumber(int _number, int _index) {
            this.number = _number;
            this.index = _index;
        }

        /**
         * @return the value of the number.
         */
        public int valueOf() {
            return number;
        }

        /**
         * Compare {@code this} and {@code b}. If the value of the two are the
         * same, compare the index.
         *
         * @param b the object to be compared.
         * @return an integer, if {@code x < y} then {@code x.compareTo(y)
         * < 0}, if {@code x > y} then {@code x.compare(y) > 0}, if {@code
         * x = y} then {@code x.compare(y) = 0}.
         */
        @Override
        public int compareTo(DistinctNumber b) {
            if (this.number != b.number) {
                return this.number - b.number;
            } else {
                return this.index - b.index;
            }
        }

        /**
         * Convert a {@code int[]} to {@code DistinctNumber[]}.
         *
         * @param intArray      the {@code int} array want to be converted.
         * @param distinctArray the {@code DistinctNumber} array want
         *                      to be saved into.
         * @return the array after converting.
         */
        public static DistinctNumber[] intArrayToDistinctArray(int[] intArray, DistinctNumber[] distinctArray) {
            for (int i = 0; i < intArray.length; ++i) {
                distinctArray[i] = new DistinctNumber(intArray[i], i);
            }
            return distinctArray;
        }

        /**
         * Convert a {@code int[]} to {@code DistinctNumber[]}.
         *
         * @param intArray the {@code int} array want to be converted.
         * @return the array after converting.
         */
        public static DistinctNumber[] intArrayToDistinctArray(int[] intArray) {
            DistinctNumber[] distinctArray = new DistinctNumber[intArray.length];
            return intArrayToDistinctArray(intArray, distinctArray);
        }

        /**
         * Convert a {@code DistinctNumber[]} to {@code int[]} .
         *
         * @param distinctArray the {@code DistinctNumber} array want
         *                      to be converted.
         * @param intArray      the {@code int} array want to be saved into.
         * @return the array after converting.
         */
        public static int[] distinctArrayToIntArray(DistinctNumber[] distinctArray, int[] intArray) {
            for (int i = 0; i < distinctArray.length; ++i) {
                intArray[i] = distinctArray[i].valueOf();
            }
            return intArray;
        }

        /**
         * Convert a {@code DistinctNumber[]} to {@code int[]} .
         *
         * @param distinctArray the {@code DistinctNumber} array want
         *                      to be converted.
         * @return the array after converting.
         */
        public static int[] distinctArrayToIntArray(DistinctNumber[] distinctArray) {
            int[] intArray = new int[distinctArray.length];
            return distinctArrayToIntArray(distinctArray, intArray);
        }
    }

    /**
     * Use Hoare partition method to move all the numbers
     * in the array smaller than {@code array[pivot]} to its front,
     * move all the numbers larger than it to its back, and
     * return the final position of the number.
     *
     * @param array a non-empty array wants to be rearranged.
     * @param pivot an integer from {@code 0} to
     *              {@code array.length - 1}, which represents
     *              the position of the pivot.
     * @return an integer from {@code 0} to {@code array.length - 1},
     * which represents the position of the pivot after rearranged.
     */
    public static int hoarePartition(DistinctNumber[] array, int pivot) {
        int left = 0, right = array.length - 1;

        while (left < right) {
            /*
            Find two positions left and right which
            satisfies that array[left] > array[pivot]
            > array[right] and left <= pivot <= right.
             */
            while (left < pivot &&
                    array[left].compareTo(array[pivot]) <= 0) {
                left++;
            }
            while (right > pivot &&
                    array[right].compareTo(array[pivot]) >= 0) {
                right--;
            }

            /*
            If pivot equals to left or right, which means
            the position of the pivot changes. So we have
            to change the position of the pivot before
            swapping left and right.
             */
            if (pivot == left) {
                pivot = right;
            } else if (pivot == right) {
                pivot = left;
            }

            /*
            Swap array[left] and array[right].
             */
            DistinctNumber temp = array[left];
            array[left] = array[right];
            array[right] = temp;
        }

        return pivot;
    }


    /**
     * Divide an array into every five integer a piece, extract
     * the median of each copy to the front end of the entire
     * array, copy the front and return it.
     *
     * @param array a non-empty {@code DistinctNumber} array want
     *              to be rearranged.
     * @return a non-empty array, contains the median of each
     * slice.
     */
    public static DistinctNumber[] divideIntoFive(DistinctNumber[] array) {
        List<DistinctNumber> mediumList = new LinkedList<>(); // Median of each slice
        List<DistinctNumber> remainList = new LinkedList<>(); // Numbers other than the median

        for (int beginSlice = 0; beginSlice < array.length; beginSlice += 5) {
            // Extract a slice.
            int endSlice = Integer.min(beginSlice + 5, array.length);
            DistinctNumber[] slice = Arrays.copyOfRange(array, beginSlice, endSlice);

            // Sort the slice and assign each number to each linked list
            Arrays.sort(slice);
            for (int i = 0; i < slice.length; ++i) {
                if (i == slice.length / 2) {
                    mediumList.add(slice[i]);
                } else {
                    remainList.add(slice[i]);
                }
            }
        }

        // Copy mediumList and remainList to the array.
        int indexOfChangedArray = 0;
        for (DistinctNumber medium : mediumList) {
            array[indexOfChangedArray] = medium;
            indexOfChangedArray++;
        }
        for (DistinctNumber remain : remainList) {
            array[indexOfChangedArray] = remain;
            indexOfChangedArray++;
        }

        // Convert mediumList to array and return.
        DistinctNumber[] mediumArray = new DistinctNumber[mediumList.size()];
        mediumList.toArray(mediumArray);
        return mediumArray;
    }


    /**
     * Give an {@code DistinctNumber} array and a number n,
     * rearrange the array to make that for all {@code i < n},
     * {@code array[i] <= array[n]}; for all {@code i > n},
     * {@code array[i] >= array[n]}.
     *
     * @param array a non-empty {@code DistinctNumber} array want
     *              to be rearranged.
     * @param n     an integer from {@code 0} to {@code n - 1}.
     */
    public static void nthElement(DistinctNumber[] array, int n) {
        if (n >= array.length) {
            throw new ArrayIndexOutOfBoundsException("n cannot " +
                    "greater than the size of array");
        }

        // Recursion bounds
        if (array.length <= 10) {
            Arrays.sort(array);
            return;
        }

        // Get the pivot
        DistinctNumber[] mediumOfSlice = divideIntoFive(array);
        nthElement(mediumOfSlice, mediumOfSlice.length / 2);
        int pivot = mediumOfSlice.length / 2;
        System.arraycopy(mediumOfSlice, 0, array, 0, mediumOfSlice.length);
        pivot = hoarePartition(array, pivot);

        // Divide and conquer by pivot
        if (n < pivot) {
            DistinctNumber[] leftSide = Arrays.copyOfRange(array, 0, pivot);
            nthElement(leftSide, n);
            System.arraycopy(array, 0, leftSide, 0, leftSide.length);
        } else if (n > pivot) {
            DistinctNumber[] rightSide = Arrays.copyOfRange(array, pivot + 1, array.length);
            nthElement(rightSide, n - pivot - 1);
            System.arraycopy(array, pivot + 1, rightSide, 0, rightSide.length);
        }
    }

    /**
     * Give an array and a number n, rearrange the array to make
     * that for all {@code i < n}, {@code array[i] <= array[n]};
     * for all {@code i > n}, {@code array[i] >= array[n]}.
     *
     * @param array a non-empty array want to be rearranged.
     * @param n     an integer from {@code 0} to {@code n - 1}.
     */
    public static void nthElement(int[] array, int n) {
        DistinctNumber[] distinctArray = DistinctNumber.intArrayToDistinctArray(array);
        nthElement(distinctArray, n);
    }
}
```
